package plant.dev.logplant.serviec;

import plant.com.cmm.exception.CustomException;
import plant.com.cmm.util.map.CustomMap;

import java.util.List;

public interface LogPlantService {
    public List<CustomMap> getPlantLog() throws CustomException;
}
